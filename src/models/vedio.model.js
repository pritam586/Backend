import mongoose,{Schema} from "mongoose";
import mongooseAggratePaginate from "mongoose-aggregate-paginate-v2"


const vedioSchema =- new Schema(
    {
        vedioFile:{
            type: String,
            required: true
        },
        thumnail:{
            type: String,
            required: true
        },
        tittle:{
            type: String,
            required: true
        },
        description:{
            type: String,
            required: true
        },
        duration:{
            type: Number,
            required: true
        },
        views:{
            type:Number,
            default: 0
        },
        isPublished:{
            type:Boolean,
            default: true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {timestamps: true}
)

    vedioSchema.plugin(mongooseAggratePaginate)

const Vedio = mongoose.model("Vedio" , vedioSchema)