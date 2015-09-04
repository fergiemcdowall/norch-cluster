var async = require('async');
var norchNodes = [];
var superRequests = [];
var numberOfNodes = 5;
var sandbox = 'test/sandbox';
var should = require('should'); 
var supertest = require('supertest');
var Norch = require('norch');


var i = 0;
async.whilst(
  function () {return (++i <= numberOfNodes)},
  function (callback) {
    var portnr = 3030 + i;
    norchNodes[i] = new Norch({
      indexPath: sandbox + '/norch-node-' + i,
      port: portnr
    }, function() {
      superRequests[i] = supertest('localhost:' + portnr);
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
        superRequests[i].get('/').expect(200).end(function(err, res) {
          if (err) throw err;
          callback();
        });
      },
      function (err) {
        done();
      }
    );
  });

});
