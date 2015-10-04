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
var _ = require('lodash');



describe('Am I A Happy Norch-Cluster?', function() {

  before(function() {
    //Spin up some "remote" norches
    var i = 0;
    async.whilst(
      function () {return (++i <= numberOfNodes)},
      function (callback) {
        var portnr = 3030 + i;
        norchNodes[i] = new Norch({
          indexPath: sandbox + '/norch-node-' + i,
          port: portnr
        }, function() {
          var url = 'http://localhost:' + portnr;
          nodeURLs.push(url);
          superRequests[i] = supertest(url);
          callback();
        });
      },
      function (err) {}
    );
  });


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
          should.exist(JSON.parse(res.text).options.port);
          (JSON.parse(res.text).options.port).should.be.exactly(3030 + i)
          callback();
        });
      },
      function (err) {
        done();
      }
    );
  });

  it('should initialize the cluster with the nodes', function(done) {
    nc = new NorchCluster({
      nodes: nodeURLs
    })
    nc.status(function (err, result) {
//      console.log(result)
      result.should.eql(
        [ { hostname: '0.0.0.0',
            port: 3031,
            indexPath: 'test/sandbox/norch-node-1' },
          { hostname: '0.0.0.0',
            port: 3032,
            indexPath: 'test/sandbox/norch-node-2' },
          { hostname: '0.0.0.0',
            port: 3033,
            indexPath: 'test/sandbox/norch-node-3' },
          { hostname: '0.0.0.0',
            port: 3034,
            indexPath: 'test/sandbox/norch-node-4' },
          { hostname: '0.0.0.0',
            port: 3035,
            indexPath: 'test/sandbox/norch-node-5' } ]
      );
      done();
    });
  });  

  it('should index some data', function(done) {
    var batch = require('../node_modules/reuters-21578-json/data/justTen/justTen.json')
    nc.add(batch, function(err, result) {
      result.should.eql([ { node: 'http://localhost:3031', response: 'Batch indexed' },
                          { node: 'http://localhost:3032', response: 'Batch indexed' },
                          { node: 'http://localhost:3033', response: 'Batch indexed' },
                          { node: 'http://localhost:3034', response: 'Batch indexed' },
                          { node: 'http://localhost:3035', response: 'Batch indexed' } ]);
      done();
    });
  });

  it('should do a search', function(done) {
    var q = {};
    q.query = {'*': ['reuter', '1987']};
    q.pageSize = 5;
    nc.search(q, function(err, result) {
      console.log(result)
      result.query.should.eql(q);
      result.hits.length.should.be.exactly(5);
      result.totalHits.should.be.exactly(10);
      _.pluck(result.hits, 'id').should.eql([ '5', '10', '4', '6', '1' ]);
      done();
    });
  });


});
