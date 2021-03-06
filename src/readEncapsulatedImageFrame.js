/**
 * Functionality for extracting encapsulated pixel data
 */


function findFragmentIndexWithOffset(fragments, offset) {
  for (var i=0; i < fragments.length; i++) {
    if (fragments[i].offset === offset) {
      return i;
    }
  }
}

function calculateNumberOfFragmentsForFrame(frameIndex, basicOffsetTable, fragments, startFragmentIndex) {
  // special case for last frame
  if (frameIndex === basicOffsetTable.length -1) {
    return fragments.length - startFragmentIndex;
  }

  // iterate through each fragment looking for the one matching the offset for the next frame
  var nextFrameOffset = basicOffsetTable[frameIndex + 1];
  for (var i=startFragmentIndex + 1; i < fragments.length; i++) {
    if (fragments[i].offset === nextFrameOffset) {
      return i - startFragmentIndex;
    }
  }

  throw "could not find fragment with offset matching basic offset table";
}

/**
 * Returns the pixel data for the specified frame in an encapsulated pixel data element that has a non
 * empty basic offset table.  Note that this function will fail if the basic offset table is empty - in that
 * case you need to determine which fragments map to which frames and read them using
 * readEncapsulatedPixelDataFromFragments().  Also see the function createJEPGBasicOffsetTable() to see
 * how a basic offset table can be created for JPEG images
 *
 * @param dataSet - the dataSet containing the encapsulated pixel data
 * @param pixelDataElement - the pixel data element (labelMapping.PixelData[0]) to extract the frame from
 * @param frameIndex - the zero based frame index
 * @param [basicOffsetTable] - optional array of starting offsets for frames
 * @param [fragments] - optional array of objects describing each fragment (offset, position, length)
 * @returns {object} with the encapsulated pixel data
 */
module.exports = function readEncapsulatedImageFrame (dataSet, pixelDataElement, frameIndex, basicOffsetTable, fragments) {
  // default parameters
  basicOffsetTable = basicOffsetTable || pixelDataElement.basicOffsetTable;
  fragments = fragments || pixelDataElement.fragments;

  // Validate parameters
  if (dataSet === undefined) {
    throw "dicomParser.readEncapsulatedImageFrame: missing required parameter 'dataSet'";
  }

  if (pixelDataElement === undefined) {
    throw "dicomParser.readEncapsulatedImageFrame: missing required parameter 'pixelDataElement'";
  }

  if (frameIndex === undefined) {
    throw "dicomParser.readEncapsulatedImageFrame: missing required parameter 'frameIndex'";
  }

  if (basicOffsetTable === undefined) {
    throw "'pixelDataElement' does not have basicOffsetTable";
  }

  if (pixelDataElement.tag !== labelMapping.PixelData[0]) {
    throw "'pixelDataElement' refers to non pixel data tag (expected tag = labelMapping.PixelData[0]'";
  }

  if (pixelDataElement.encapsulatedPixelData !== true) {
    throw "'pixelDataElement' refers to pixel data element that does not have encapsulated pixel data";
  }

  if (pixelDataElement.hadUndefinedLength !== true) {
    throw "'pixelDataElement' refers to pixel data element that does not have undefined length";
  }

  if (pixelDataElement.fragments === undefined) {
    throw "'pixelDataElement' refers to pixel data element that does not have fragments";
  }

  if (basicOffsetTable.length === 0) {
    throw "dicomParser.readEncapsulatedImageFrame: basicOffsetTable has zero entries";
  }

  if (frameIndex < 0) {
    throw "'frameIndex' must be >= 0";
  }

  if (frameIndex >= basicOffsetTable.length) {
    throw "'frameIndex' must be < basicOffsetTable.length";
  }

  // find starting fragment based on the offset for the frame in the basic offset table
  var offset = basicOffsetTable[frameIndex],
      startFragmentIndex = findFragmentIndexWithOffset(fragments, offset);

  if (startFragmentIndex === undefined) {
    throw "unable to find fragment that matches basic offset table entry";
  }

  // calculate the number of fragments for this frame
  var numFragments = calculateNumberOfFragmentsForFrame(
          frameIndex, basicOffsetTable, fragments, startFragmentIndex);

  // now extract the frame from the fragments
  return dicomParser.readEncapsulatedPixelDataFromFragments(
          dataSet, pixelDataElement, startFragmentIndex, numFragments, fragments);
};
