import SwiftUI

struct LoginView: View {
    @ObservedObject var viewModel: AppViewModel

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("MindAnchor for Mac")
                .font(.largeTitle.bold())
            Text(text("登录后即可同步活动、提醒和恢复建议。", "Sign in to sync activity, reminders, and recovery suggestions."))
                .foregroundStyle(.secondary)
            DiagnosticCallout(
                title: viewModel.bootstrapStatusTitle,
                message: viewModel.bootstrapStatusMessage,
                tone: viewModel.bootstrapState == .degraded ? .warning : .neutral
            )
            TextField(text("显示名称（可选）", "Display name (optional)"), text: $viewModel.displayName)
                .textFieldStyle(.roundedBorder)
            TextField("Email", text: $viewModel.email)
                .textFieldStyle(.roundedBorder)
            SecureField(text("密码", "Password"), text: $viewModel.password)
                .textFieldStyle(.roundedBorder)
            if let error = viewModel.userFacingCurrentErrorMessage ?? viewModel.currentError {
                Text(error)
                    .foregroundStyle(.orange)
            }
            HStack {
                Button(viewModel.isBusy ? text("登录中…", "Signing in…") : text("登录", "Sign In")) {
                    Task { await viewModel.signIn() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.isBusy)

                Button(viewModel.isBusy ? text("创建中…", "Creating…") : text("创建账户", "Create Account")) {
                    Task { await viewModel.register() }
                }
                .buttonStyle(.bordered)
                .disabled(viewModel.isBusy)
            }
        }
        .padding(32)
        .frame(maxWidth: 420)
    }
}
