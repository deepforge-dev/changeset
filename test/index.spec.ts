const expect = require('chai').expect;
const {default: diff, deepCopy, DiffType} = require('../index');


describe('changeset', function () {

  it('should be able to diff two objects and return a changeset', function (done) {
      let a = {
        name: 'Eugene',
        number: 42,
        tags: ['tag1', 'tag2', 'tag3'],
        scores: {
          tetris: 1000,
          carmageddon: 3,
          someArray: ['one', 'two', 'three']
        }
      };

      var b = {
        name: 'Susan',
        number: 43,
        tags: ['tag1', 'tag4'],
        scores: {
          carmageddon: 3,
          zelda: 3000,
          someArray: ['one', 'three']
        },
        age: 37
      };

      const changes = diff(a, b);
      expect(changes).to.deep.equal([
        { type: DiffType.PUT, key: ['name'], value: 'Susan' },
        { type: DiffType.PUT, key: ['number'], value: 43 },
        { type: DiffType.PUT, key: ['tags', '1'], value: 'tag4' },
        { type: DiffType.DEL, key: ['tags', '2'] },
        { type: DiffType.PUT, key: [ 'scores', 'someArray', '1' ], value: 'three' },
        { type: DiffType.DEL, key: [ 'scores', 'someArray', '2' ] },
        { type: DiffType.DEL, key: ['scores', 'tetris'] },
        { type: DiffType.PUT, key: ['scores', 'zelda'], value: 3000 },
        { type: DiffType.PUT, key: ['age'], value: 37 },
      ]);

      done();
    });

  it('should be able to handle basic types', function (done) {
    var a = 'Eugene';
    var b = 'Susan';

    var changes = diff(a, b);
    expect(changes).to.deep.equal([
      { type: DiffType.PUT, key: [], value: 'Susan' }
    ]);

    done();
  });

  it('should be able to handle nulls', function (done) {
    var changes;

    changes = diff(null, 'Susan');
    expect(changes).to.deep.equal([
      { type: DiffType.PUT, key: [], value: 'Susan' }
    ]);

    changes = diff('Eugene', null);
    expect(changes).to.deep.equal([
      { type: DiffType.PUT, key: [], value: null }
    ]);

    done();
  });

  it('should be able to handle undefined', function (done) {
    var changes;

    changes = diff(undefined, 'Susan');
    expect(changes).to.deep.equal([
      { type: DiffType.PUT, key: [], value: 'Susan' }
    ]);

    changes = diff('Eugene', undefined);
    expect(changes).to.deep.equal([
      { type: DiffType.DEL, key: [] }
    ]);

    done();
  });

  it('should be able to apply a changeset to an object', function (done) {
    var a = {
      name: 'Eugene',
      number: 42,
      tags: ['tag1', 'tag2', 'tag3'],
      scores: {
        tetris: 1000,
        carmageddon: 3,
        someArray: ['one', 'two', 'three']
      }
    };


    var b = {
      name: 'Susan',
      number: 43,
      tags: ['tag1', 'tag4'],
      scores: {
        carmageddon: 3,
        zelda: 3000,
        someArray: ['one', 'three']
      },
      age: 37
    };


    var bClone = deepCopy(b);

    var changes = diff(a, b);
    var b_ = diff.apply(changes, a);
    expect(b_.scores.someArray.length).to.equal(b.scores.someArray.length);
    expect(b_).to.deep.equals(b);
    expect(b).to.deep.equals(bClone); // Target did not change.
    done();
  });

  it('should be able to apply a changeset to a value', function (done) {
    var a = 'Eugene';
    var b = 'Susan';

    var changes = diff(a, b);
    var b_ = diff.apply(changes, a);
    expect(b_).to.deep.equals(b);
    done();
  });

  it('should be able to apply a changeset with nulls', function (done) {
    var changes, b_;

    changes = diff(null, 'Susan');
     b_ = diff.apply(changes, null);
    expect(b_).to.deep.equals('Susan');

    changes = diff('Eugene', null);
     b_ = diff.apply(changes, 'Eugene');
    expect(b_).to.deep.equals(null);

    done();
  });

  it('should be able to apply a changeset with undefined', function (done) {
    var changes, b_;

    changes = diff(undefined, 'Susan');
     b_ = diff.apply(changes, undefined);
    expect(b_).to.deep.equals('Susan');

    changes = diff('Eugene', undefined);
     b_ = diff.apply(changes, 'Eugene');
    expect(b_).to.deep.equals(null);

    done();
  });

  it('should be able to apply a changeset to an object and modify it',
      function (done) {
        var a = {
          name: 'Eugene',
          number: 42,
          tags: ['tag1', 'tag2', 'tag3'],
          scores: {
            tetris: 1000,
            carmageddon: 3,
            someArray: ['one', 'two', 'three']
          }
        };

        a.self = a;
        a.scoresAgain = a.scores;

        var b = {
          name: 'Susan',
          number: 43,
          tags: ['tag1', 'tag4'],
          scores: {
            carmageddon: 3,
            zelda: 3000,
            someArray: ['one', 'three']
          },
          age: 37
        };

        var changes = diff(a, b);
        var b_ = diff.apply(changes, a, true);
        expect(b_.scores.someArray.length).to.equal(b.scores.someArray.length);
        expect(b_).to.deep.equals(b);
        expect(b_).to.equal(a);
        done();
    });

  it('should be able to self-modify and replace an entire object',
    function(done) {
      var data = { name: 'Eugene', number: 43 };
      var change = [ { type: DiffType.PUT, key: [], value: 'xxx' } ];
      var obj = diff.apply(change, data, true);
      expect(obj).to.equal('xxx');
      done();
    });

  it('should be able to deal with incrementally built arrays', function(done) {
    var obj = [];
    var changeset = [
      { type: DiffType.PUT, key: [], value: [] },
      { type: DiffType.PUT, key: [ 0, 'make' ], value: 'Toyota' },
      { type: DiffType.PUT, key: [ 0, 'model' ], value: 'Camry' },
      { type: DiffType.PUT, key: [ 1, 'make' ], value: 'Toyota' },
      { type: DiffType.PUT, key: [ 1, 'model' ], value: 'Corolla' } ];
    obj = diff.apply(changeset, obj, true);
    expect(obj).to.deep.equals([
      { make: 'Toyota', model: 'Camry' },
      { make: 'Toyota', model: 'Corolla' }
    ]);
    done();
  });

  it('should be able to diff from an object to a basic type', function() {
    var a = {hello: {nested: 2}};
    var b = {hello: 3};
    var changeset = diff(a, b);
    var b_ = diff.apply(changeset, a);
    expect(b).to.deep.equals(b_);
  });

  it('should sort array deletions from end', function() {
    const a = ['a', 'b', 'c', 'd', 'e'];
    const b = ['f', 'g'];
    const changes = diff(a, b);
    const delKeys = changes
        .filter(change => change.type === DiffType.DEL)
        .map(change => change.key[0]);

    delKeys.reduce((prev, next) => {
        expect(+prev).to.be.above(+next);
        return next;
    });
  });
});
