set -ex
npm run clean
npm install
npm run prepare:package
npm run build
npm publish --workspaces --tag latest --access public
