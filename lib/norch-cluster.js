//should be own module?
var distributeArray = function (array, totalNewArrays) {
  var _ = require('lodash');
  var chunksize = Math.floor(array.length / totalNewArrays)
  var newArrays = _.chunk(array, chunksize);
  for (var i = totalNewArrays; i < newArrays.length; i++)
    newArrays[i - totalNewArrays] = newArrays[i - totalNewArrays].concat(newArrays[i]);
  return newArrays.slice(0, totalNewArrays);
}



module.exports = function (options) {
  var NorchCluster = {};

  var _ = require('lodash');

  var defaults = {
    nodes: []
  };

  NorchCluster.options = _.defaults(options || {}, defaults);

  console.log('nodes available: ' + NorchCluster.options.nodes);

  NorchCluster.add = function (batch, callback) {
    var chunks = distributeArray(batch, NorchCluster.options.nodes.length);
    console.log(chunks)
    callback(null, 'indexed');
  };

  //code to verify node integrity
  return NorchCluster;
}
