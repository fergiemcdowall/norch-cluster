module.exports = function (options) {
  var NorchCluster = {};

  var _ = require('lodash');

  var defaults = {
    nodes: []
  };

  NorchCluster.options = _.defaults(options || {}, defaults);


  for (var i = 0; i < NorchCluster.options.nodes.length; i++) {
    console.log('node avaiable: ' + NorchCluster.options.nodes);
  }


  //code to verify node integrity

  return NorchCluster;
}
