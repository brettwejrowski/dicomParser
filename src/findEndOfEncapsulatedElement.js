/**
 * Internal helper functions for parsing DICOM elements
 */

/**
 * Reads an encapsulated pixel data element and adds an array of fragments to the element
 * containing the offset and length of each fragment and any offsets from the basic offset
 * table
 * @param byteStream
 * @param element
 */

const labelMapping = require('labelMapping');

module.exports = function findEndOfEncapsulatedElement (byteStream, element, warnings) {
  if (byteStream === undefined) {
    throw "missing required parameter 'byteStream'";
  }
  if (element === undefined) {
    throw "missing required parameter 'element'";
  }

  element.encapsulatedPixelData = true;
  element.basicOffsetTable = [];
  element.fragments = [];

  var basicOffsetTableItemTag = dicomParser.readTag(byteStream);
  if (basicOffsetTableItemTag !== labelMapping.Item[0]) {
    throw "basic offset table not found";
  }

  var basicOffsetTableItemlength = byteStream.readUint32(),
      numFragments = basicOffsetTableItemlength / 4;

  for (var i =0; i < numFragments; i++) {
    var offset = byteStream.readUint32();
    element.basicOffsetTable.push(offset);
  }

  var baseOffset = byteStream.position;

  while (byteStream.position < byteStream.byteArray.length) {
    var tag = dicomParser.readTag(byteStream),
        length = byteStream.readUint32();

    if (tag === labelMapping.SequenceDelimitationTag[0]) {
      byteStream.seek(length);
      element.length = byteStream.position - element.dataOffset;
      return;
    
    } else if (tag === labelMapping.Item[0]) {
      element.fragments.push({
        offset: byteStream.position - baseOffset - 8,
        position : byteStream.position,
        length : length
      });
    
    } else {
      if (warnings) {
        warnings.push('unexpected tag ' + tag + ' while searching for end of pixel data element with undefined length');
      }

      if (length > byteStream.byteArray.length - byteStream.position) {
        length = byteStream.byteArray.length - byteStream.position;
      }
      element.fragments.push({
        offset: byteStream.position - baseOffset - 8,
        position : byteStream.position,
        length : length
      });
      byteStream.seek(length);
      element.length = byteStream.position - element.dataOffset;
      return;
    }

    byteStream.seek(length);
  }

  if (warnings) {
    warnings.push("pixel data element " + element.tag + " missing sequence delimiter tag labelMapping.SequenceDelimitationTag[0]");
  }
};

