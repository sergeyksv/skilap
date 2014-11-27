MSON = require '../lib/mson'

bson = require 'bson'
ObjectID = bson.BSONPure.ObjectID
DBRef = bson.BSONPure.DBRef

original = 
  _id: ObjectID("507f1f77bcf86cd799439011")
  title: "Super"
  related: [
    ObjectID("507f1f77bcf86cd799439011"), 
    ObjectID("507f1f77bcf86cd799439012"), 
    ObjectID("507f1f77bcf86cd799439013")
  ]
  owner: DBRef("groups",ObjectID("507f191e810c19729de860ea"))
  updatedAt: 
    $gte: new Date "2012-02-07T18:32:42.692Z" 
    $lte: new Date "2013-02-07T18:32:42.692Z"

expected = """
{"_id":ObjectId("507f1f77bcf86cd799439011"),"title":"Super","related":[ObjectId("507f1f77bcf86cd799439011"),ObjectId("507f1f77bcf86cd799439012"),ObjectId("507f1f77bcf86cd799439013")],"owner":{"$ref":"groups","$id":"507f191e810c19729de860ea"},"updatedAt":{"$gte":ISODate("2012-02-07T18:32:42.692Z"),"$lte":ISODate("2013-02-07T18:32:42.692Z")}}
"""

serialized = MSON.stringify original
parsed = MSON.parseUnsafe serialized
serializedAgain = MSON.stringify parsed

tests =
  "correct output": serialized is expected 
  "exact round-trip": serialized is serializedAgain

console.log name + ": " + outcome for name, outcome of tests
throw new Error "Test '#{name}' failed." for name, outcome of tests when not outcome
console.log "All tests passed."