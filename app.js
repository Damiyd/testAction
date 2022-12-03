/**
 * Module dependencies.
 */
 const express = require('express');
 const trackRoute = express.Router();
 const multer = require('multer');
 const mongoose = require('mongoose');
 const { ObjectID } = require('mongodb');
 const { createModel } = require('mongoose-gridfs');
 const { Readable } = require('stream');
//  const DB_NAME = process.env.DB_HOST;
 
 /**
  * Create Express server && Express Router configuration.
  */
 const app = express();
 //global
 let Attachment;
 app.use('/video', trackRoute);
 
 /**
  * Connect Mongo Driver to MongoDB.
  */
  mongoose.connect("mongodb+srv://test:sparta@cluster0.zslujo2.mongodb.net/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
}).then(()=> {
    console.log("Connected to MongoDB");
  	// Allocate model into Attachment
    Attachment = createModel();
}).catch((error) => {
    console.error(error);
});
 
 /**
  * GET /audio/:trackID
  */
 trackRoute.get('/:trackID', (req, res) => {
     if(!req.params.trackID) {
         return res.status(400).json({
             message: "Invalid trackID in URL parameter."
         });
     }
     res.set('content-type', 'video/mp4');
     res.set('accept-ranges', 'bytes');
     
     try {
         const reader = Attachment.read({_id: ObjectID(req.params.trackID)});   
         reader.on('data', (chunk)=> {
             res.write(chunk);
         });
         reader.on('close', () => {
             console.log("All Sent!");
             res.end();
         });
     } catch(err) {
         console.log(err);
         res.status(404).json({
             message:"Cannot find files that have the ID",
         });
     }
 });
 
 /**
  * POST /audio
  */
 trackRoute.post('/', (req, res) => {
    const storage = multer.memoryStorage()
    const upload = multer({ storage: storage, limits: { fields: 1, files: 1, parts: 3 }});
    upload.single("file")(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err });
        } else if(!req.body.name) {
            return res.status(400).json({ message: "No track name in request body" });
        }

        const readStream = Readable.from(req.file.buffer);
        const options = ({ filename: req.body.name, contenttype: "video/mp4"});
        Attachment.write(options, readStream, (err, file) => {
            if (err)
                return res.status(400).json({message: "Bad Request"});
            else {
                console.log("Posted! \n" + file.toString());
                return res.status(200).json({
                    message: "Successfully Saved!",
                    file: file,
            });
            }
        })
    });
});
 
 /**
  * DELETE /audio/:trackID
  */
 trackRoute.delete("/:trackID", (req, res)=> {
     if(!req.params.trackID) {
         return res.status(400).json({
             message: "Invalid trackID in URL parameter."
         });
     }
     
     Attachment.unlink({_id: ObjectID(req.params.trackID)}, (err, file)=> {
         if (err) {
             console.log("Failed to delete\n" + err);
             return res.status(400).json({
                 message: "Wrong Request",
                 error: err.message,
             });
         }
         
         console.log('Deleted\n' + file);
         return res.status(200).json({
             message: "Successfully Deleted",
             file: file,
         });
     });   
 });
   
 app.listen(3005, () => {
     console.log("App listening on port 3005!");
 });