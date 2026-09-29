import { Component } from 'react'
import type { ReactNode } from 'react'

export default class LoadBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <p role="alert" className="notice error">
        This section could not load. You can keep using the page. Reload when
        your connection is available to try again.
      </p>
    ) : (
      this.props.children
    )
  }
}
