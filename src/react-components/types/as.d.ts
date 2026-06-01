import type * as React from 'react'

// The following is an `as` property implementation
// that was copy-pasted from https://www.benmvp.com/blog/polymorphic-react-components-typescript/
//
// P.S. `as` property is now deprecated, so this file is a legacy one.
// Use `itemsContainerComponent` property instead.
//
// "A more precise version of `React.ComponentPropsWithoutRef`".
// It's not clear what exactly they meant by that.
type PropsOf<
	Component extends keyof React.JSX.IntrinsicElements | React.JSXElementConstructor<any>
> = React.JSX.LibraryManagedAttributes<Component, React.ComponentPropsWithoutRef<Component>>
//
// Combines props with any additional props.
type CombineProps<
	BaseProps = {},
	AdditionalProps = {}
> = Omit<BaseProps, keyof AdditionalProps> & AdditionalProps
//
// Combines component props with any additional props.
type CombineComponentPropsWith<
	Component extends React.ElementType,
	Props = {}
> = CombineProps<PropsOf<Component>, Props>
//
// Adds an `component: Component` property.
export type WithComponentProperty<
	Component extends React.ElementType,
	Props = {}
> = CombineComponentPropsWith<Component, Props & { as?: Component }>
// //
// // This is a type of a `ref` that will be passed to a given `Component`.
// export type ComponentRef<
//   Component extends React.ElementType
// > = React.ComponentPropsWithRef<Component>['ref']
// //
// // Adds an `as: AsComponent` property along with a `ref` property.
// export type WithAsPropertyAndRef<
//   AsComponent extends React.ElementType,
//   Props = {}
// > = WithAsProperty<AsComponent, Props> & {
// 	ref?: ComponentRef<AsComponent>
// }
