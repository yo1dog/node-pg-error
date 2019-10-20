const util          = require('util');
const getInfoString = require('./getInfoString');


module.exports = function formatMessage(message, meta) {
  const messagePart = formatMessagePart(message);
  const metaPart    = formatMetaPart(meta);
  
  let formatedMessage = messagePart;
  if (metaPart !== null)  {
    formatedMessage += ' ' + createMetaString(meta);
  }
  
  return formatedMessage;
};

function formatMessagePart(message) {
  // the message should be a non-empty string
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  
  // if not then create an informative string about the given value
  return getInfoString(message);
}

function formatMetaPart(meta) {
  // meta is optional
  if (typeof meta === 'undefined' || meta === null) {
    return null;
  }
  
  // meta should be an object
  if (typeof meta === 'object') {
    return meta;
  }
  
  // if not then create an object with and set meta as a property
  return {meta: meta};
}

function createMetaString(meta) {
  let metaStr = util.inspect(meta);
  
  // util.inspect sometimes puts the keys on seperate lines. However,
  // the first key is always on the same line as the first open curly
  // and it looks wierd. Let's fix that
  if (metaStr.indexOf('\n') !== -1) {
    // replace the starting '{ ' with '{\n  ' and the ending ' }' with '\n}'
    metaStr = '{\n  ' + metaStr.substring(2, metaStr.length - 2) + '\n}';
  }
  
  return metaStr;
}