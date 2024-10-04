const mongoose = require("mongoose");

var mongoURL = 'mongodb+srv://Ottocska:Ottocska2003@reservroom.cmrtd.mongodb.net/resrvrooms'

mongoose.connect(mongoURL,{useUnifiedTopology : true, useNewUrlParser:true})

var connection = mongoose.connection

connection.on('error', ()=>{
    console.log('MongoDB connection failed')
})

connection.on('connected', ()=>{
    console.log('MongoDB connection successful')
})

module.exports = mongoose