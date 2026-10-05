import assert from 'node:assert/strict';

// Only the converter's containing-app controller scene is modified.
export function nativeLauncherStoryboard(text) {
  const views = [...text.matchAll(/<wkWebView\b[\s\S]*?<\/wkWebView>/g)];
  const outlets = [...text.matchAll(/<outlet property="webView"[^>]*\/>/g)];
  assert.equal(views.length, 1, 'Expected exactly one generated launcher WebView');
  assert.equal(outlets.length, 1, 'Expected exactly one generated launcher WebView outlet');
  const id = /\bid="([^"]+)"/.exec(views[0][0])?.[1];
  assert(outlets[0][0].includes(`destination="${id}"`), 'Launcher outlet must reference the generated WebView');
  const result = text.replace(views[0][0], '').replace(outlets[0][0], '');
  assert(!/wkWebView|property="webView"/.test(result), 'Unexpected remaining launcher WebView');
  return result;
}

export function nativeLauncherSource(extensionId) {
  assert.equal(extensionId, 'training.elec.qualification.checker.extension');
  return `import Cocoa
import SafariServices

let extensionBundleIdentifier = "${extensionId}"

class ViewController: NSViewController {
    private let status = NSTextField(wrappingLabelWithString: "You can enable the extension in Safari Settings → Extensions.")

    override func viewDidLoad() {
        super.viewDidLoad()
        let title = NSTextField(wrappingLabelWithString: "UK Electrician Route Checker")
        title.font = .boldSystemFont(ofSize: 20)
        let instructions = NSTextField(wrappingLabelWithString: "This app installs a Safari extension.\\n\\n1. Open Safari Settings → Extensions.\\n2. Enable UK Electrician Route Checker.\\n3. Open its Safari toolbar button and choose your starting qualification route.\\n\\nIf the button is missing, use Safari → View → Customize Toolbar.")
        let button = NSButton(title: "Open Safari Extension Settings", target: self, action: #selector(openSafariSettings))
        button.bezelStyle = .rounded
        button.setAccessibilityIdentifier("open-safari-extension-settings")
        let stack = NSStackView(views: [title, instructions, status, button])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 14
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        for label in [title, instructions, status] {
            label.widthAnchor.constraint(equalTo: stack.widthAnchor).isActive = true
        }
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            stack.topAnchor.constraint(equalTo: view.topAnchor, constant: 24),
            stack.bottomAnchor.constraint(lessThanOrEqualTo: view.bottomAnchor, constant: -24)
        ])
        preferredContentSize = NSSize(width: 520, height: 400)
        refreshState()
    }

    override func viewDidAppear() {
        super.viewDidAppear()
        view.window?.setContentSize(NSSize(width: 520, height: 400))
    }

    private func refreshState() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { [weak self] state, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                if error != nil || state == nil {
                    self.status.stringValue = "Extension status is unavailable. Open Safari Settings → Extensions to enable it."
                } else if state!.isEnabled {
                    self.status.stringValue = "Extension enabled. Open its button in the Safari toolbar to check a route."
                } else {
                    self.status.stringValue = "Extension installed. Enable it in Safari Settings → Extensions."
                }
            }
        }
    }

    @objc private func openSafariSettings() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { [weak self] error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                if error != nil {
                    self.status.stringValue = "Could not open settings automatically. Open Safari → Settings → Extensions manually."
                } else {
                    self.refreshState()
                }
            }
        }
    }
}
`;
}
