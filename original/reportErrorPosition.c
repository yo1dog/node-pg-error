// source: https://github.com/postgres/postgres/blob/c9d29775195922136c09cc980bb1b7091bf3d859/src/interfaces/libpq/fe-protocol3.c#L1156
/*
 * Add an error-location display to the error message under construction.
 *
 * The cursor location is measured in logical characters; the query string
 * is presumed to be in the specified encoding.
 */
static void
reportErrorPosition(PQExpBuffer msg, const char *query, int loc, int encoding)
{
#define DISPLAY_SIZE	60		/* screen width limit, in screen cols */
#define MIN_RIGHT_CUT	10		/* try to keep this far away from EOL */

	char	   *wquery;
	int			slen,
				cno,
				i,
			   *qidx,
			   *scridx,
				qoffset,
				scroffset,
				ibeg,
				iend,
				loc_line;
	bool		mb_encoding,
				beg_trunc,
				end_trunc;

	/* Convert loc from 1-based to 0-based; no-op if out of range */
	loc--;
	if (loc < 0)
		return;

	/* Need a writable copy of the query */
	wquery = strdup(query);
	if (wquery == NULL)
		return;					/* fail silently if out of memory */

	/*
	 * Each character might occupy multiple physical bytes in the string, and
	 * in some Far Eastern character sets it might take more than one screen
	 * column as well.  We compute the starting byte offset and starting
	 * screen column of each logical character, and store these in qidx[] and
	 * scridx[] respectively.
	 */

	/* we need a safe allocation size... */
	slen = strlen(wquery) + 1;

	qidx = (int *) malloc(slen * sizeof(int));
	if (qidx == NULL)
	{
		free(wquery);
		return;
	}
	scridx = (int *) malloc(slen * sizeof(int));
	if (scridx == NULL)
	{
		free(qidx);
		free(wquery);
		return;
	}

	/* We can optimize a bit if it's a single-byte encoding */
	mb_encoding = (pg_encoding_max_length(encoding) != 1);

	/*
	 * Within the scanning loop, cno is the current character's logical
	 * number, qoffset is its offset in wquery, and scroffset is its starting
	 * logical screen column (all indexed from 0).  "loc" is the logical
	 * character number of the error location.  We scan to determine loc_line
	 * (the 1-based line number containing loc) and ibeg/iend (first character
	 * number and last+1 character number of the line containing loc). Note
	 * that qidx[] and scridx[] are filled only as far as iend.
	 */
	qoffset = 0;
	scroffset = 0;
	loc_line = 1;
	ibeg = 0;
	iend = -1;					/* -1 means not set yet */

	for (cno = 0; wquery[qoffset] != '\0'; cno++)
	{
		char		ch = wquery[qoffset];

		qidx[cno] = qoffset;
		scridx[cno] = scroffset;

		/*
		 * Replace tabs with spaces in the writable copy.  (Later we might
		 * want to think about coping with their variable screen width, but
		 * not today.)
		 */
		if (ch == '\t')
			wquery[qoffset] = ' ';

		/*
		 * If end-of-line, count lines and mark positions. Each \r or \n
		 * counts as a line except when \r \n appear together.
		 */
		else if (ch == '\r' || ch == '\n')
		{
			if (cno < loc)
			{
				if (ch == '\r' ||
					cno == 0 ||
					wquery[qidx[cno - 1]] != '\r')
					loc_line++;
				/* extract beginning = last line start before loc. */
				ibeg = cno + 1;
			}
			else
			{
				/* set extract end. */
				iend = cno;
				/* done scanning. */
				break;
			}
		}

		/* Advance */
		if (mb_encoding)
		{
			int			w;

			w = pg_encoding_dsplen(encoding, &wquery[qoffset]);
			/* treat any non-tab control chars as width 1 */
			if (w <= 0)
				w = 1;
			scroffset += w;
			qoffset += pg_encoding_mblen(encoding, &wquery[qoffset]);
		}
		else
		{
			/* We assume wide chars only exist in multibyte encodings */
			scroffset++;
			qoffset++;
		}
	}
	/* Fix up if we didn't find an end-of-line after loc */
	if (iend < 0)
	{
		iend = cno;				/* query length in chars, +1 */
		qidx[iend] = qoffset;
		scridx[iend] = scroffset;
	}

	/* Print only if loc is within computed query length */
	if (loc <= cno)
	{
		/* If the line extracted is too long, we truncate it. */
		beg_trunc = false;
		end_trunc = false;
		if (scridx[iend] - scridx[ibeg] > DISPLAY_SIZE)
		{
			/*
			 * We first truncate right if it is enough.  This code might be
			 * off a space or so on enforcing MIN_RIGHT_CUT if there's a wide
			 * character right there, but that should be okay.
			 */
			if (scridx[ibeg] + DISPLAY_SIZE >= scridx[loc] + MIN_RIGHT_CUT)
			{
				while (scridx[iend] - scridx[ibeg] > DISPLAY_SIZE)
					iend--;
				end_trunc = true;
			}
			else
			{
				/* Truncate right if not too close to loc. */
				while (scridx[loc] + MIN_RIGHT_CUT < scridx[iend])
				{
					iend--;
					end_trunc = true;
				}

				/* Truncate left if still too long. */
				while (scridx[iend] - scridx[ibeg] > DISPLAY_SIZE)
				{
					ibeg++;
					beg_trunc = true;
				}
			}
		}

		/* truncate working copy at desired endpoint */
		wquery[qidx[iend]] = '\0';

		/* Begin building the finished message. */
		i = msg->len;
		appendPQExpBuffer(msg, libpq_gettext("LINE %d: "), loc_line);
		if (beg_trunc)
			appendPQExpBufferStr(msg, "...");

		/*
		 * While we have the prefix in the msg buffer, compute its screen
		 * width.
		 */
		scroffset = 0;
		for (; i < msg->len; i += pg_encoding_mblen(encoding, &msg->data[i]))
		{
			int			w = pg_encoding_dsplen(encoding, &msg->data[i]);

			if (w <= 0)
				w = 1;
			scroffset += w;
		}

		/* Finish up the LINE message line. */
		appendPQExpBufferStr(msg, &wquery[qidx[ibeg]]);
		if (end_trunc)
			appendPQExpBufferStr(msg, "...");
		appendPQExpBufferChar(msg, '\n');

		/* Now emit the cursor marker line. */
		scroffset += scridx[loc] - scridx[ibeg];
		for (i = 0; i < scroffset; i++)
			appendPQExpBufferChar(msg, ' ');
		appendPQExpBufferChar(msg, '^');
		appendPQExpBufferChar(msg, '\n');
	}

	/* Clean up. */
	free(scridx);
	free(qidx);
	free(wquery);
}