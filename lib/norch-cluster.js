var da = require('distribute-array');
var async = require('async');
var request = require('request');
var supertest = require('supertest');

module.exports = function (options) {
  var NorchCluster = {};
  var _ = require('lodash');
  var defaults = {
    nodes: []
  };
  NorchCluster.options = _.defaults(options || {}, defaults);
  console.log('nodes available: ' + NorchCluster.options.nodes);


  NorchCluster.status = function (callbackster) {
    async.map
    (NorchCluster.options.nodes,
     function(item, callback){
       request(item + '/tellMeAboutMyNorch', function (error, res, body) {
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
       })
     },
     function(err, result){
       callbackster(err, result);
     });
  };


  NorchCluster.add = function (batch, callbackster) {
    var chunks = da(batch, NorchCluster.options.nodes.length);
    async.map
    (NorchCluster.options.nodes,
     function(item, callback){
       var thisURL = item + '/indexer';
       var thisChunk = JSON.stringify(chunks.pop());
       var formData = {
         document: thisChunk
       };
       request.post({url: thisURL, formData: formData},
                    function (err, httpResponse, body) {
                      callback(err, {node: item, response: body});
                    });
     },
     function(err, result){
       callbackster(err, result);
     });
  };

  
  return NorchCluster;
}
