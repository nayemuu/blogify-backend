import fs from "fs";

export const removeLocalFile = (filePath) => {
  if (filePath) {
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error("Local File system error: ", error);
      }
    });
  }
};
