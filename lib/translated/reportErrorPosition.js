// translated from ../../original/reportErrorPosition.c
const wcwidth = require('wcwidth.js');


/**
 * @param {string} query
 * @param {number} loc
 * @returns {string | undefined}
 */
module.exports = function reportErrorPosition(query, loc) {
  // NOTE: JavaScript uses UTF-16 strings
  
  const DISPLAY_SIZE  = 60; // screen width limit, in screen cols
  const MIN_RIGHT_CUT = 10; // try to keep this far away from EOL
  
  // Convert loc from 1-based to 0-based; no-op if out of range
  loc--;
  if (loc < 0) {
    return;
  }
  
  // Need a writable copy of the query
  // NOTE: since strings in JavaScript are read-only, let's replace tabs
  // with spaces here instead of later in the loop
  // NOTE: expects string to be NULL terminated
  const wquery = (
    query
    .replace(/\t/g, ' ')
  ) + '\0';
  
  /*
   * Each character might occupy multiple physical bytes in the string, and
   * in some Far Eastern character sets it might take more than one screen
   * column as well.  We compute the starting byte offset and starting
   * screen column of each logical character, and store these in qidx[] and
   * scridx[] respectively.
   */
  /** @type {number[]} */ const qidx = [];
  /** @type {number[]} */ const scridx = [];
  
  /*
   * Within the scanning loop, cno is the current character's logical
   * number, qoffset is its offset in wquery, and scroffset is its starting
   * logical screen column (all indexed from 0).  "loc" is the logical
   * character number of the error location.  We scan to determine loc_line
   * (the 1-based line number containing loc) and ibeg/iend (first character
   * number and last+1 character number of the line containing loc). Note
   * that qidx[] and scridx[] are filled only as far as iend.
   */
  let qoffset = 0;
  let scroffset = 0;
  let loc_line = 1;
  let ibeg = 0;
  let iend = -1; // -1 means not set yet
  
  let cno;
  for (cno = 0; wquery[qoffset] !== '\0'; cno++) {
    const ch = wquery[qoffset];
    
    qidx[cno] = qoffset;
    scridx[cno] = scroffset;
    
    /*
     * Replace tabs with spaces in the writable copy.  (Later we might
     * want to think about coping with their variable screen width, but
     * not today.)
     */
    if (ch === '\t') {
      // NOTE: we already did this above
    }
    
    /*
     * If end-of-line, count lines and mark positions. Each \r or \n
     * counts as a line except when \r \n appear together.
     */
    else if (ch === '\r' || ch === '\n') {
      if (cno < loc) {
        if (
          ch === '\r' ||
          cno === 0 ||
          wquery[qidx[cno - 1]] !== '\r'
        ) {
          loc_line++;
        }
        // extract beginning = last line start before loc.
        ibeg = cno + 1;
      }
      else {
        // set extract end.
        iend = cno;
        // done scanning.
        break;
      }
    }
    
    let w = pg_encoding_dsplen(wquery, qoffset);
    // treat any non-tab control chars as width 1
    if (w <= 0) {
      w = 1;
    }
    scroffset += w;
    qoffset += pg_encoding_mblen(wquery, qoffset);
  }
  
  // Fix up if we didn't find an end-of-line after loc
  if (iend < 0) {
    iend = cno; // query length in chars, +1
    qidx[iend] = qoffset;
    scridx[iend] = scroffset;
  }
  
  // NOTE: start customization
  const loc_char = (loc - ibeg) + 1;
  // NOTE: end customization
  
  // Print only if loc is within computed query length
  if (loc <= cno) {
    // If the line extracted is too long, we truncate it.
    let beg_trunc = false;
    let end_trunc = false;
    if (scridx[iend] - scridx[ibeg] > DISPLAY_SIZE) {
      /*
       * We first truncate right if it is enough.  This code might be
       * off a space or so on enforcing MIN_RIGHT_CUT if there's a wide
       * character right there, but that should be okay.
       */
      if (scridx[ibeg] + DISPLAY_SIZE >= scridx[loc] + MIN_RIGHT_CUT) {
        while (scridx[iend] - scridx[ibeg] > DISPLAY_SIZE) {
          iend--;
        }
        end_trunc = true;
      }
      else {
        // Truncate right if not too close to loc.
        while (scridx[loc] + MIN_RIGHT_CUT < scridx[iend]) {
          iend--;
          end_trunc = true;
        }

        // Truncate left if still too long.
        while (scridx[iend] - scridx[ibeg] > DISPLAY_SIZE) {
          ibeg++;
          beg_trunc = true;
        }
      }
    }
    
    // truncate working copy at desired endpoint
    // NOTE: JavaScript strings are not writable, so we will truncate later
    
    // Begin building the finished message.
    let msg = '';
    
    // NOTE: customization start
    // NOTE: lets include the column and put the query text on its own line
    //msg += `LINE ${loc_line}: `;
    msg += `LINE ${loc_line}: CHAR ${loc_char}:\n`;
    // NOTE: customization end
    
    let i = msg.length;
    if (beg_trunc) {
      msg += '...';
    }
    
    /*
     * While we have the prefix in the msg buffer, compute its screen
     * width.
     */
    scroffset = 0;
    for (; i < msg.length; i += pg_encoding_mblen(msg, i))
    {
      let w = pg_encoding_dsplen(msg, i);
      
      if (w <= 0) {
        w = 1;
      }
      scroffset += w;
    }
    
    // Finish up the LINE message line.
    msg += wquery.substring(qidx[ibeg], qidx[iend]);
    if (end_trunc) {
      msg += '...';
    }
    msg += '\n';
    
    // Now emit the cursor marker line.
    scroffset += scridx[loc] - scridx[ibeg];
    for (i = 0; i < scroffset; i++) {
      msg += ' ';
    }
    
    msg += '^';
    msg += '\n';
    
    return msg;
  }
};

/**
 * @param {string} str 
 * @param {number} index 
 * @returns {number}
 */
function pg_encoding_dsplen(str, index) {
  return pg_utf_dsplen(str, index);
}

/**
 * @param {string} str 
 * @param {number} index 
 * @returns {number}
 */
function pg_utf_dsplen(str, index) {
  return wcwidth(str.codePointAt(index) || 0);
}

/**
 * @param {string} str 
 * @param {number} index 
 * @returns {number}
 */
function pg_encoding_mblen(str, index) {
  return isSurrogatePair(str, index)? 2 : 1;
}

/**
 * @param {string} str 
 * @param {number} index 
 * @returns {boolean}
 */
function isSurrogatePair(str, index) {
  if (index > str.length - 2) return false;
  const codeUnit1 = str.charCodeAt(index);
  const codeUnit2 = str.charCodeAt(index + 1);
  
  // https://en.wikipedia.org/wiki/UTF-16#Code_points_from_U+010000_to_U+10FFFF
  // "the ranges for the
  // high surrogates (0xD800–0xDBFF)
  // low surrogates (0xDC00–0xDFFF)"
  return (
    (codeUnit1 >= 0xD800 && codeUnit1 <= 0xDBFF) &&
    (codeUnit2 >= 0xDC00 && codeUnit2 <= 0xDFFF)
  );
}