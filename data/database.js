const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let database;

const connect = async () => {
    const client = await MongoClient.connect('mongodb://127.0.0.1:27017');   //connection to whole server. return promise
    database = client.db('blog'); //specify db
}

//extract 'database' outer to another file 
const getDb = () => {
    if (!database)
        throw {message: 'DB connection not establish'};
    return database;
}

module.exports = {
    connectToDatabase: connect,
    getDb: getDb
}