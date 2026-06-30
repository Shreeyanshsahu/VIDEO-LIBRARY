import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const videoSchema = new Schema(
    {
        videoFile: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        owner: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        tags: {
            type: [String],
            default: []
        },
        duration: {
            type: String,//cloudinary duration
            required: true
        },
        isPublished: {
            type: Boolean,
            default: false
        }
    },{
        timestamps:true
    }
)

videoSchema.plugin(mongoosePaginate);

export const video = mongoose.model("Video", videoSchema)