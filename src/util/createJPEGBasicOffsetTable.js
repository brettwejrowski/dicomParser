/**
 * Utility function for creating a basic offset table for JPEG transfer syntaxes
 */


// Each JPEG image has an end of image marker 0xFFD9
function isEndOfImageMarker(dataSet, position) {
  return (dataSet.byteArray[position] === 0xFF &&
  dataSet.byteArray[position + 1] === 0xD9);
}

function isFragmentEndOfImage(dataSet, pixelDataElement, fragmentIndex) {
  var fragment = pixelDataElement.fragments[fragmentIndex];
  // Need to check the last two bytes and the last three bytes for marker since odd length
  // fragments are zero padded
  if (isEndOfImageMarker(dataSet, fragment.position + fragment.length - 2) ||
    isEndOfImageMarker(dataSet, fragment.position + fragment.length - 3)) {
    return true;
  }
  return false;
}

function findLastImageFrameFragmentIndex(dataSet, pixelDataElement, startFragment) {
  for (var fragmentIndex=startFragment; fragmentIndex < pixelDataElement.fragments.length; fragmentIndex++) {
    if (isFragmentEndOfImage(dataSet, pixelDataElement, fragmentIndex)) {
      return fragmentIndex;
    }
  }
}

/**
 * Creates a basic offset table by scanning fragments for JPEG start of image and end Of Image markers
 * @param {object} dataSet - the parsed dicom dataset
 * @param {object} pixelDataElement - the pixel data element
 * @param [fragments] - optional array of objects describing each fragment (offset, position, length)
 * @returns {Array} basic offset table (array of offsets to beginning of each frame)
 */
module.exports = function createJPEGBasicOffsetTable (dataSet, pixelDataElement, fragments) {
  // Validate parameters
  if (dataSet === undefined) {
    throw 'missing required parameter dataSet';
  }
  if (pixelDataElement === undefined) {
    throw 'missing required parameter pixelDataElement';
  }
  if (pixelDataElement.tag !== labelMapping.PixelData[0]) {
    throw "parameter 'pixelDataElement' refers to non pixel data tag (expected tag = labelMapping.PixelData[0]'";
  }
  if (pixelDataElement.encapsulatedPixelData !== true) {
    throw "parameter 'pixelDataElement' refers to pixel data element that does not have encapsulated pixel data";
  }
  if (pixelDataElement.hadUndefinedLength !== true) {
    throw "parameter 'pixelDataElement' refers to pixel data element that does not have encapsulated pixel data";
  }
  if (pixelDataElement.basicOffsetTable === undefined) {
    throw "parameter 'pixelDataElement' refers to pixel data element that does not have encapsulated pixel data";
  }
  if (pixelDataElement.fragments === undefined) {
    throw "parameter 'pixelDataElement' refers to pixel data element that does not have encapsulated pixel data";
  }
  if (pixelDataElement.fragments.length <= 0) {
    throw "parameter 'pixelDataElement' refers to pixel data element that does not have encapsulated pixel data";
  }
  if (fragments && fragments.length <=0) {
    throw "parameter 'fragments' must not be zero length";
  }

  // Default values
  fragments = fragments || pixelDataElement.fragments;

  var basicOffsetTable = [],
      startFragmentIndex = 0;

  while (true) {
    // Add the offset for the start fragment
    basicOffsetTable.push(pixelDataElement.fragments[startFragmentIndex].offset);
    var endFragmentIndex = findLastImageFrameFragmentIndex(dataSet, pixelDataElement, startFragmentIndex);
    
    if (endFragmentIndex === undefined || endFragmentIndex === pixelDataElement.fragments.length -1) {
      return basicOffsetTable;
    }
    startFragmentIndex = endFragmentIndex + 1;
  }
};

