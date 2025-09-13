## Scripts

### Production Script (`npm start`)

```json
"start": "node ./src/index.js"
```

Explanation:

node ./src/index.js
Runs the application using Node.js in production mode.

Does not use nodemon, so the server will not automatically restart if you make changes.

Intended for deployment or running the stable build.

### Development Script (npm run dev)

```json
"dev": "cross-env NODE_ENV=development nodemon ./src/index.js"
```

Explanation:

cross-env NODE_ENV=development

Sets the environment variable NODE_ENV=development in a cross-platform way.

Works on Windows, macOS, Linux.

Without cross-env, Windows users would see an error ('NODE_ENV' is not recognized...) because Windows doesn’t support setting environment variables inline like Unix systems.

nodemon ./src/index.js
Starts the app with auto-reload enabled.

Watches for file changes and restarts the server automatically.

This makes development faster and smoother.
