# Safari encryption declaration

The current approved WebExtension has no cryptographic library, VPN functionality, custom encryption, encrypted messaging, authentication system or local encrypted storage. All route content is local. Its normal HTTPS links open through Safari/system APIs. No extension networking API or storage is added by this work.

The generated containing application's Info.plist receives the **Boolean** `ITSAppUsesNonExemptEncryption = false`. The same Boolean is applied to the generated extension plist for consistent disclosure. This edits the native packaging wrapper, not the approved WebExtension resources. Version is set to 1.0.0 and the build number is explicit.

Phase 1 reads the source plists back with plutil. Archive and exported-payload checks read both final products' Info.plist files and require a literal false Boolean. Successful signed runs publish `export-compliance.json` recording the checks. For manual verification on a Mac:

```sh
/usr/libexec/PlistBuddy -c 'Print :ITSAppUsesNonExemptEncryption' '/path/to/App.app/Contents/Info.plist'
```

Expected output: `false`. A missing key, string value or true value fails validation.

Generated native source is screened for unexpected networking/crypto and included in the Phase 1 fingerprint review. The account owner must review that actual wrapper and final App Store Connect questions before upload. Any future crypto/native library/functionality change requires a fresh determination and rebuilt/retested package.

This declares **no non-exempt encryption based on the current implementation**. It does not claim Apple granted an exemption, accepted a declaration or waived any developer obligation. No signed build or Apple compliance response has been observed yet.

References: [Apple's plist key](https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption), [encryption declaration guidance](https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations), [App Store Connect export-compliance workflow](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance).
