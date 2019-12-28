# AfterEffects Scripts

These are scripts for AfterEffets CC2019+ I've created. 
Initially they were in the ExtendScript style JavaScript but now I moved to TypeScript.

# Building and Using
Run `npm install && npm run build` to install the dependencies and run the TSC.
The scripts are in the `dist` folder.
In AfterEffects go to `File > Scripts > Run Script File...` and select the script.

## Debugging
VSCode has [an extension](https://marketplace.visualstudio.com/items?itemName=Adobe.extendscript-debug) to debug scripts.
For general running there's a PowerShell script called `powershell/RunAfterEffectsScript.ps1`. You can run it like this:
```powershell
powershell/RunAfterEffectsScript.ps1 -file PATH_TO_ROOT/dist/SCRIPT.js
```
# MarkerToKey
Marker to key or (M2K) "converts" markers (comp or layer) to keys on a Null Layer.
These keys can then be used in expressions.
