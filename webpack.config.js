module.exports = {
  entry: ['./src/index.ts', './src/index.css'],
  output: {
    path: __dirname,
    publicPath: '/',
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gltf)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.(frag|vert)$/,
        loader: 'shader-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};
