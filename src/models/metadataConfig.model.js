import mongoose from 'mongoose';

const metadataConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      description: 'Identifier name for the form field, e.g., author_name',
    },
    label: {
      type: String,
      required: true,
      trim: true,
      description: 'Display label, e.g., Nama Penulis',
    },
    dataType: {
      type: String,
      enum: ['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT'],
      required: true,
      description: 'The type of input expected',
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      description: 'Options array intended to be used when dataType is SELECT',
    },
    isActive: {
      type: Boolean,
      default: true,
      description: 'If false, this field will not be requested on new submissions',
    },
    order: {
      type: Number,
      default: 0,
      description: 'Rendering order in the UI form',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('MetadataConfig', metadataConfigSchema);
