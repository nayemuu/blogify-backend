import { Image } from "../models/imageModel.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "./cloudinary.js";

export const uploadImage = async (localFilePath) => {
  try {
    const imageCredentials = await uploadOnCloudinary(localFilePath);
    // console.log("imageCredentials = ", imageCredentials);
    Image.create(imageCredentials);
    return imageCredentials;
  } catch (error) {
    console.log("error on imageUploadUtils uploadImage = ", error);
    throw error;
  }
};

export const deleteImage = async (imageUrl) => {
  // console.log("imageUrl = ", imageUrl);
  try {
    // let allImage = await Image.find({});
    // console.log("allImage = ", allImage);
    let imageDetails = await Image.findOneAndDelete({
      secure_url: imageUrl,
    });

    console.log("imageDetails = ", imageDetails);
    if (imageDetails?.public_id) {
      deleteFromCloudinary(imageDetails.public_id);
    }
  } catch (error) {
    console.log("error on imageUploadUtils deleteImage = ", error);
  }
};
