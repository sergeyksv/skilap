bson = require 'bson'
ObjectId = bson.BSONPure.ObjectID # Mongo shell requires lowercase d
DBRef = bson.BSONPure.DBRef

ISODate = (ISODateString) -> new Date ISODateString

module.exports = MSON = {}
MSON.stringify = (value) ->
  JSON.stringify value # throws if object contains any circular references
  return undefined if typeof value is "function"
  return undefined if typeof value is "undefined"
  return "null" if value is null
  return stringifyDbRef value if value.constructor.name is "DBRef" 
  return "ObjectId(\"#{value.toString()}\")" if value.constructor.name is "ObjectID" # Mongo shell requires lowercase d
  return "ISODate(\"#{value.toISOString()}\")" if value instanceof Date
  return stringifyArray value if value instanceof Array
  return JSON.stringify value if typeof value isnt "object" # but rather, any primitive (number,string,boolean)
  return JSON.stringify value if value.constructor.name in ["Number","String","Boolean"]
  return stringifyPlainObject value if value.constructor.name is "Object"
  throw new Error "Object contains value with unknown prototype '#{value.constructor.name}'"

MSON.parseUnsafe = (value) ->
  eval "(" + value + ")"

stringifyPlainObject = (object) ->
  "{" + makeFieldLiterals(object).join(",") + "}"

# If undefined, a function, or an XML value is encountered during conversion it is either omitted 
# (when it is found in an object) or censored to null (when it is found in an array).
makeFieldLiterals = (object) ->
  for key, value of object when typeof value not in ["function","undefined"]
    JSON.stringify(key) + ":" + MSON.stringify(value) 

# DBRefs have the form { $ref : <value>, $id : <value>, $db : <value> }
# $db is optional. Field order matters.
# See: http://docs.mongodb.org/manual/applications/database-references/
# See also: https://jira.mongodb.org/browse/SERVER-248 says $ref must come before $id
stringifyDbRef = (dbRef) ->
  refJSON = {}
  refJSON.$ref = dbRef.namespace
  refJSON.$id = dbRef.oid
  refJSON.$db = dbRef.db if dbRef.db?
  JSON.stringify refJSON

stringifyArray = (array) ->
  "[" + (MSON.stringify value for value in array).join(",") + "]"