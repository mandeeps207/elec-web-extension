import Cocoa

// Executes on macOS CI. Does not open Safari or grant any capability.
let application = NSApplication.shared
let controller = ViewController()
controller.view = NSView(frame: NSRect(x: 0, y: 0, width: 520, height: 400))
controller.viewDidLoad()
func descendants(_ view: NSView) -> [NSView] {
    return view.subviews.flatMap { [$0] + descendants($0) }
}
let views = descendants(controller.view)
let labels = views.compactMap { ($0 as? NSTextField)?.stringValue }
precondition(labels.contains("UK Electrician Route Checker"), "Launcher title missing")
precondition(labels.contains { $0.contains("1. Open Safari Settings") && $0.contains("3. Open its Safari toolbar button") }, "Instructions missing on initial render")
precondition(labels.contains { $0.contains("You can enable the extension") }, "Initial status missing")
let buttons = views.compactMap { $0 as? NSButton }
precondition(buttons.count == 1 && buttons[0].title == "Open Safari Extension Settings" && buttons[0].action != nil, "Settings action missing")
precondition(!views.contains { String(describing: type(of: $0)).contains("WKWebView") }, "Unexpected WebKit launcher dependency")
print("PASS: native launcher content and action exist before extension-state callback")
