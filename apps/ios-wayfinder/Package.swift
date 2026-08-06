// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MindAnchorIOS",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "WayfinderHealth", targets: ["WayfinderHealth"]),
    ],
    targets: [
        .target(name: "WayfinderHealth"),
        .testTarget(name: "WayfinderHealthTests", dependencies: ["WayfinderHealth"]),
    ]
)
