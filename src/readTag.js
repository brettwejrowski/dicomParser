/**
 * Internal helper functions for parsing DICOM elements
 */

module.exports = function readTag (byteStream) {
  if (byteStream === undefined) {
    throw "missing required parameter 'byteStream'";
  }

  var groupNumber = byteStream.readUint16() * 256 * 256, 
    elementNumber = byteStream.readUint16(),
    tag = "x" + ('00000000' + (groupNumber + elementNumber).toString(16)).substr(-8);
  return tag;
};

