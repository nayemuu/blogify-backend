import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "./appError.js";

const UPLOADS_FOLDER = "./public/images";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_FOLDER)) {
      fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
    }
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname); // path.extname() ব্যবহার প্রয়োজন আমাদেরকে nodejs এর core একটি module, path module import করতে হবে
    const filename = `${file.originalname
      .replace(fileExt, "")
      .toLowerCase()
      .split(" ")
      .join("-")}-${Date.now()}`;

    cb(null, filename + fileExt);
  },
});

// preapre the final multer upload object
export const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, //5mb- (fileSize byte ae input  নেয়)
  },

  fileFilter: (req, file, cb) => {
    // এখানে file.fieldname দিয়ে check করে নেওয়ার কারণ হচ্ছে upload ব্যবহার করে যতগুলো ফাইল আপলোড করবো সবগুলোই এই object এর সবগুলো statement execute করবে
    if (
      file.fieldname === "icon" ||
      file.fieldname === "logo" ||
      file.fieldname === "thumbnail"
    ) {
      // console.log("file.mimetype = ", file.mimetype );
      if (
        // file.mimetype === "image/png" ||
        // file.mimetype === "image/jpeg" ||
        // file.mimetype === "image/svg+xml" ||
        file.mimetype === "image/webp"
      ) {
        cb(null, true);
      } else {
        cb(
          new AppError(
            "Only jpg, png, jpeg, svg, webp formats are allowed!",
            400
          )
        );
      }
    } else {
      cb(new AppError("This field is not defined in multer", 400)); // যদি কোন field match না করে
    }
  },
});
