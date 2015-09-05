var da = require('distribute-array');
var async = require('async');
var request = require('request');

module.exports = function (options) {
  var NorchCluster = {};

  var _ = require('lodash');

  var defaults = {
    nodes: []
  };

  NorchCluster.options = _.defaults(options || {}, defaults);

  console.log('nodes available: ' + NorchCluster.options.nodes);

  NorchCluster.status = function (batch, callbackster) {
    var chunks = da(batch, NorchCluster.options.nodes.length);
    var requests = [];
    var getNodeUrl = function(){return options.nodes.pop();}


    for (var i = 0; i < options.nodes.length; i++) {
      requests[i] = function(callback) {
        var url = getNodeUrl() + '/tellMeAboutMyNorch';
        request(url, function (error, res, body) {
          if (!error && res.statusCode == 200) {
            var b = JSON.parse(res.body).options;
            var msg = {};
            msg.hostname = b.hostname;
            msg.port = b.port;
            msg.indexPath = b.indexPath;
            callback(null, msg);
          }
          else{
            console.log('error: ' + error)
          }
        });
      }
    }

    async.parallel(requests, function(err, results) {
      callbackster(null, results);
    });

  };

  //code to verify node integrity
  return NorchCluster;
}
