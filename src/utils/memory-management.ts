// src/utils/memory-management.ts - 修正版
import React from 'react';
import type { Root } from 'react-dom/client';

export class CleanupManager {
  private cleanupFunctions: Set<() => void> = new Set();

  public add(cleanupFn: () => void): void {
    this.cleanupFunctions.add(cleanupFn);
  }

  public remove(cleanupFn: () => void): void {
    this.cleanupFunctions.delete(cleanupFn);
  }

  public cleanup(): void {
    this.cleanupFunctions.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    });
    this.cleanupFunctions.clear();
  }

  public size(): number {
    return this.cleanupFunctions.size;
  }
}

export class ReactRootManager {
  private roots: Map<Element, Root> = new Map();
  private createRootFn: ((container: Element) => Root) | null = null;

  constructor() {
    this.initializeCreateRoot();
  }

  private initializeCreateRoot(): void {
    try {
      if (typeof window !== 'undefined') {
        // Try to get createRoot from react-dom/client
        try {
          // Use dynamic require for Next.js compatibility
          const reactDomClient = eval('require')('react-dom/client');
          if (reactDomClient && reactDomClient.createRoot) {
            this.createRootFn = reactDomClient.createRoot;
            return;
          }
        } catch (error) {
          // Continue to next method
        }

        // Check if createRoot is available on window.ReactDOM
        const ReactDOM = (window as any).ReactDOM;
        if (ReactDOM && ReactDOM.createRoot) {
          this.createRootFn = ReactDOM.createRoot;
          return;
        }

        // Check for ReactDOMClient on window
        const ReactDOMClient = (window as any).ReactDOMClient;
        if (ReactDOMClient && ReactDOMClient.createRoot) {
          this.createRootFn = ReactDOMClient.createRoot;
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to initialize createRoot:', error);
    }
  }

  public createRoot(container: Element): Root {
    if (this.roots.has(container)) {
      return this.roots.get(container)!;
    }

    let root: Root;

    if (this.createRootFn) {
      root = this.createRootFn(container);
    } else {
      // Simplified fallback that works with MapKit's synchronous requirements
      root = {
        render: (element: React.ReactElement) => {
          try {
            // Try to use ReactDOM.render if available (React 17 compatibility)
            const ReactDOM = (window as any).ReactDOM;
            if (ReactDOM && ReactDOM.render) {
              ReactDOM.render(element, container);
            } else {
              // Fallback: Extract basic props and render as HTML
              this.renderAsHTML(element, container);
            }
          } catch (error) {
            console.error('Failed to render element:', error);
            container.innerHTML = '<div>Render Error</div>';
          }
        },
        unmount: () => {
          try {
            const ReactDOM = (window as any).ReactDOM;
            if (ReactDOM && ReactDOM.unmountComponentAtNode) {
              ReactDOM.unmountComponentAtNode(container);
            } else {
              container.innerHTML = '';
            }
          } catch (error) {
            console.warn('Failed to unmount:', error);
            container.innerHTML = '';
          }
        }
      } as Root;
    }

    this.roots.set(container, root);
    return root;
  }

  private renderAsHTML(element: React.ReactElement, container: Element): void {
    try {
      if (element && typeof element === 'object' && element.props) {
        // 型安全にpropsを扱う
        const props = element.props as Record<string, any>;
        const { children, className, style, ...otherProps } = props;
        
        const div = document.createElement('div');
        
        // className設定
        if (className && typeof className === 'string') {
          div.className = className;
        }
        
        // style設定
        if (style && typeof style === 'object' && style !== null) {
          Object.assign(div.style, style);
        }
        
        // その他のpropsを属性として設定（安全なもののみ）
        this.setSafeAttributes(div, otherProps);
        
        // children処理
        this.renderChildren(div, children);
        
        container.appendChild(div);
      } else {
        container.innerHTML = '<div>Invalid Element</div>';
      }
    } catch (error) {
      console.error('HTML fallback render failed:', error);
      container.innerHTML = '<div>Fallback Error</div>';
    }
  }

  private renderChildren(parentElement: Element, children: unknown): void {
    try {
      if (typeof children === 'string') {
        parentElement.textContent = children;
      } else if (typeof children === 'number') {
        parentElement.textContent = String(children);
      } else if (Array.isArray(children)) {
        // 配列の場合は各要素を処理
        children.forEach(child => {
          if (typeof child === 'string' || typeof child === 'number') {
            const textNode = document.createTextNode(String(child));
            parentElement.appendChild(textNode);
          } else if (React.isValidElement(child)) {
            // React要素の場合は再帰的に処理
            this.renderReactElement(parentElement, child);
          }
        });
      } else if (React.isValidElement(children)) {
        // 単一のReact要素
        this.renderReactElement(parentElement, children);
      } else if (children !== null && children !== undefined) {
        // その他の値は文字列化
        parentElement.textContent = String(children);
      }
    } catch (error) {
      console.warn('Error rendering children:', error);
      parentElement.textContent = 'Content Error';
    }
  }

  private renderReactElement(parentElement: Element, element: React.ReactElement): void {
    try {
      if (typeof element.type === 'string') {
        // HTML要素の場合
        const htmlElement = document.createElement(element.type);
        const props = element.props as Record<string, any>;
        
        // 基本的な属性設定
        if (props.className) htmlElement.className = String(props.className);
        if (props.style && typeof props.style === 'object') {
          Object.assign(htmlElement.style, props.style);
        }
        
        this.setSafeAttributes(htmlElement, props);
        this.renderChildren(htmlElement, props.children);
        
        parentElement.appendChild(htmlElement);
      } else {
        // カスタムコンポーネントの場合は簡単なテキスト表示
        const div = document.createElement('div');
        div.textContent = '[Component]';
        parentElement.appendChild(div);
      }
    } catch (error) {
      console.warn('Error rendering React element:', error);
      const errorDiv = document.createElement('div');
      errorDiv.textContent = '[Render Error]';
      parentElement.appendChild(errorDiv);
    }
  }

  private setSafeAttributes(element: HTMLElement, props: Record<string, any>): void {
    // 安全な属性のみ設定
    const safeAttributes = [
      'id', 'title', 'alt', 'role', 'aria-label', 'aria-describedby',
      'data-*', 'tabindex'
    ];
    
    Object.entries(props).forEach(([key, value]) => {
      if (
        safeAttributes.some(attr => 
          attr.endsWith('*') ? key.startsWith(attr.slice(0, -1)) : key === attr
        ) &&
        typeof value === 'string'
      ) {
        try {
          element.setAttribute(key, value);
        } catch (error) {
          // 属性設定に失敗した場合は無視
        }
      }
    });
  }

  public unmountRoot(container: Element): void {
    const root = this.roots.get(container);
    if (root) {
      try {
        root.unmount();
      } catch (error) {
        console.warn('Error unmounting root:', error);
      }
      this.roots.delete(container);
    }
  }

  public cleanup(): void {
    this.roots.forEach((root, container) => {
      try {
        root.unmount();
      } catch (error) {
        console.warn('Error unmounting root during cleanup:', error);
      }
    });
    this.roots.clear();
  }

  public getRootCount(): number {
    return this.roots.size;
  }
}