import { Images } from "../../../both/collections/images.collection";
import { Image } from "../../../both/models/image.model";
//import * as bodyParser from "body-parser";
var bodyParser = require('body-parser');

declare var Picker: any;

// Define our middleware using the Picker.middleware() method.
Picker.middleware( bodyParser.json() );
Picker.middleware( bodyParser.urlencoded( { extended: false } ) );

// Define our routes.
Picker.route( '/bookings/voucher/:id', function( params, request, response, next ) {
  let fs = require("fs-extra");

  let filePath = `${process.env.PWD}/../uploads/pdfs/voucher-${params.id}.pdf`;

  fs.readFile(`${filePath}`, (err, data) => {
    if (err) {
      response.end( "Error while downloading file. Please recheck the file name." );
      console.log(err);
    }
    else {
      response.setHeader('Content-Type', 'application/force-download');
      response.setHeader("Content-Disposition","attachment; filename=\"voucher-" + params.id + ".pdf\"");
      response.end( data );
    }
  });
});

Picker.route("/uploads/images/:id-:w-:h.jpg", function( params, request, response, next ) {
  console.log(params);

  let qt = require("quickthumb");
  let fs = require("fs-extra");
  let image = Images.collection.findOne({_id: params.id});
  if (typeof image == "undefined" || ! image._id) {
      // throw new Meteor.Error(`Invalid image-id "${images[i].id}"`);
      response.end( "Invalid image-id" );
      return;
  }
  let imagePath = process.env.PWD + '/../uploads/images/' + image._id + '.' + image.extension;
  // let destPath = process.env.PWD + '/uploads/images/' + image._id + '-350x280.' + image.extension;
  let destPath = `${process.env.PWD}/../uploads/images/${image._id}-${params.w}x${params.h}.${image.extension}`;
  console.log(destPath);

  function readFile() {
    fs.readFile(destPath, (err, data) => {
      if (err) {
        response.end( "Error while downloading file. Please recheck the file name." );
        console.log(err);
      }
      else {
        response.setHeader('Last-Modified', 'Mon, 22 May 2017 09:30:00 GMT');
        response.setHeader('Expires', 'Thu, 25 Jun 2099 09:30:00 GMT');
        response.setHeader('Content-Type', 'image/jpeg');
        response.setHeader('Cache-Control', 'max-age=2628000, public');
        response.end( data );
      }
    });
  }

  if (fs.existsSync(destPath)) {
    console.log("load from cache");
    readFile();
    return;
  }

  console.log("generate thumb");
  qt.convert({
    src: imagePath,
    dst: destPath,
    width: params.w,
    height: params.h
  }, (err, res) => {
    if (err) {
      console.log(err);
      return;
    }
    readFile();
  });
});
