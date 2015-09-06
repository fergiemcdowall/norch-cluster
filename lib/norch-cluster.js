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

  NorchCluster.status = function (callbackster) {
    var requests = [];
    var nodes = _.clone(NorchCluster.options.nodes);
    var getNodeUrl = function(){return nodes.pop();}
    for (var i = 0; i < options.nodes.length; i++) {
      requests[i] = function(callback) {
        request(getNodeUrl() + '/tellMeAboutMyNorch', function (error, res, body) {
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

  NorchCluster.add = function (batch, callback) {
    var chunks = da(batch, NorchCluster.options.nodes.length);
    var addRequests = []; 
    for (var i = 0; i < chunks.length; i++) {
      addRequests[i] = function(callback) {
        superrequest.post('/indexer')
          .attach('document', chunks)
          .expect(200)
          .end(function(err, res) {
            if (err) return callback();
            callback();
          });
      }
    }    
    callback(null, chunks);
  };

  //code to verify node integrity
  return NorchCluster;
}
