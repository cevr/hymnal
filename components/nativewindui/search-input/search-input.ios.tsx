import { useAugmentedRef, useControllableState } from '@rn-primitives/hooks';
import { Icon } from '@roninoss/icons';
import * as React from 'react';
import {
  TextInput,
  View,
  ViewStyle,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';

import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/use-color-scheme';

import type { SearchInputProps } from './types';

// Add as class when possible: https://github.com/marklawlor/nativewind/issues/522
const BORDER_CURVE: ViewStyle = {
  borderCurve: 'continuous',
};

const SearchInput = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  SearchInputProps
>(
  (
    {
      value: valueProp,
      onChangeText: onChangeTextProp,
      onFocus: onFocusProp,
      placeholder = 'Search...',
      cancelText = 'Cancel',
      containerClassName,
      iconContainerClassName,
      className,
      iconColor,
      ...props
    },
    ref,
  ) => {
    const { colors } = useColorScheme();
    const inputRef = useAugmentedRef({ ref, methods: { focus, blur, clear } });
    const [showCancel, setShowCancel] = React.useState(false);

    const [value = '', onChangeText] = useControllableState({
      prop: valueProp,
      defaultProp: valueProp ?? '',
      onChange: onChangeTextProp,
    });

    function focus() {
      inputRef.current?.focus();
    }

    function blur() {
      inputRef.current?.blur();
    }

    function clear() {
      onChangeText('');
    }

    function onFocus(e: NativeSyntheticEvent<TextInputFocusEventData>) {
      setShowCancel(true);
      onFocusProp?.(e);
    }

    return (
      <View className="flex-row items-center">
        <View
          style={BORDER_CURVE}
          className={cn(
            'flex-1 flex-row rounded-lg bg-card',
            containerClassName,
          )}
        >
          <View
            className={cn(
              'absolute bottom-0 left-0 top-0 z-50 justify-center pl-1.5',
              iconContainerClassName,
            )}
          >
            <Icon
              color={iconColor ?? colors.grey3}
              name="magnify"
              size={22}
            />
          </View>
          <TextInput
            ref={inputRef}
            placeholder={placeholder}
            className={cn(
              !showCancel && 'active:bg-muted/5 dark:active:bg-muted/20',
              'flex-1 rounded-lg py-2 pl-8 pr-1 text-[17px] text-foreground',
              className,
            )}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            clearButtonMode="while-editing"
            role="searchbox"
            {...props}
          />
        </View>
      </View>
    );
  },
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
