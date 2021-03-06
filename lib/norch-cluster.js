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
       var thisChunk = JSON.stringify(chunks.pop());
       request.post({url: item + '/indexer', formData: {document: thisChunk}},
                    function (err, httpResponse, body) {
                      callback(err, {node: item, response: body});
                    });
     },
     function(err, result){
       callbackster(err, result);
     });
  };


  NorchCluster.search = function (q, callbackster) {
    async.map
    (NorchCluster.options.nodes,
     function(item, callback){
       request(item + '/search?q=' + JSON.stringify(q), function (err, res, body) {
//         console.log(body);
         callback(err, JSON.parse(body))
       });
     },
     function(err, result){
       var resultSet = {};
       resultSet.query = q;

//todo: facets

       resultSet.totalHits =
         _.pluck(result, 'totalHits').reduce(function(total, n) {
           return total + n;
         });

       resultSet.totalDocsInIndex =
         _.pluck(result, 'totalDocsInIndex').reduce(function(total, n) {
           return total + n;
         });

       resultSet.documentFrequencies =
         _.pluck(result, 'documentFrequencies').reduce(function(total, n) {
           for (var i in n) {
             if (!total[i]) total[i] = 0;
             total[i] = total[i] + n[i];
           }
           return total;
         });

       resultSet.fieldWeight = result[0].fieldWeight;

       resultSet.hits = _(result)
         .pluck('hits')
         .flatten()
         .sortBy(function(hit) {
           hit.tf.forEach(function (tfEntry) {
             var tf = +tfEntry[1];
             var weight = +resultSet.fieldWeight[tfEntry[0]];
             var totalDocsInIndex = +resultSet.totalDocsInIndex;
             var df = +resultSet.documentFrequencies[tfEntry[0]];
             var idf = weight * Math.log10(1 + (totalDocsInIndex / df));
             hit.score = +hit.score + (tf * idf);
           });
           return hit.score;
         })
         .reverse()
         .drop(q.pageSize)
         .value();
       callbackster(err, resultSet);
     });    
  }
  
  return NorchCluster;
}
