var Norch = require('norch');
var async = require('async');
var NorchCluster = require('../');
var nc;
var nodeURLs = [];
var norchNodes = [];
var numberOfNodes = 5;
var sandbox = 'test/sandbox';
var should = require('should'); 
var superRequests = [];
var supertest = require('supertest');

var i = 0;
async.whilst(
  function () {return (++i <= numberOfNodes)},
  function (callback) {
    var portnr = 3030 + i;
    norchNodes[i] = new Norch({
      indexPath: sandbox + '/norch-node-' + i,
      port: portnr
    }, function() {
      var url = 'localhost:' + portnr;
      nodeURLs.push(url);
      superRequests[i] = supertest(url);
      callback();
    });
  },
  function (err) {}
);



describe('Am I A Happy Norch-Cluster?', function() {

  it('should verify nodes', function(done) {
    var i = 0;
    async.whilst(
      function () {
        return  (++i <= numberOfNodes);
      },
      function (callback) {
        superRequests[i].get('/tellMeAboutMyNorch').expect(200).end(function(err, res) {
          if (err) throw err;
          should.exist(res);
          should.exist(JSON.parse(res.text).options.port, 3030 + i);
          callback();
        });
      },
      function (err) {
        done();
      }
    );
  });

  it('should initialize the cluster with the nodes', function(done) {
    var batch = require('../node_modules/reuters-21578-json/data/justTen/justTen.json')
    nc = new NorchCluster({
      nodes: nodeURLs
    })
    nc.add(batch, function (err, result) {

    })
    done();
  });  

});


