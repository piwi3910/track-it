# Contributing to Track-It

Thank you for your interest in contributing to Track-It! This document outlines the process for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a professional and respectful attitude towards others.

## Contribution Requirements

### Commit Signing Requirement

**All commits must be GPG signed by Pascal Watteel (pascal@watteel.com).**

This project enforces commit signing to maintain the security and authenticity of the codebase. Only signed commits from the authorized maintainer will be accepted.

### Setting Up GPG Signing

If you are an authorized contributor, follow these steps to set up GPG signing:

1. **Generate a GPG key** (if you don't already have one):
   ```bash
   gpg --full-generate-key
   ```

2. **List your GPG keys**:
   ```bash
   gpg --list-secret-keys --keyid-format=long
   ```

3. **Configure Git to use your GPG key**:
   ```bash
   git config --global user.signingkey YOUR_KEY_ID
   git config --global commit.gpgsign true
   ```

4. **Add your GPG key to GitHub**:
   - Export your public key: `gpg --armor --export YOUR_KEY_ID`
   - Add the key to your GitHub account in Settings > SSH and GPG keys

5. **Verify your setup** by making a signed commit:
   ```bash
   git commit -S -m "Test signed commit"
   ```

## Contribution Process

1. **Create a GitHub issue** describing the change you wish to make
2. **Create a feature branch** with the naming convention: `issue-NUMBER-brief-description`
3. **Make your changes**, ensuring all commits are properly signed
4. **Submit a pull request**, referencing the original issue

## Pull Request Process

1. Ensure your code passes all tests
2. Update documentation as needed
3. The PR title should follow the format: `[Fix #NUMBER] Brief description`
4. All pull requests must be reviewed and approved by the maintainer

## Code Style

Follow the coding standards and architecture patterns established in the project, as outlined in the README and CLAUDE.md files.

## Questions?

If you have any questions or need assistance, please open an issue for discussion.