import { Select as BaseSelect } from 'antd'
import React from 'react'
import { SelectProps } from 'antd/lib/select'
import { OptionProps } from 'antd/lib/select'

export type ISelect = SelectProps<any>

export const Select: React.FC<ISelect> = ({ ...rest }) => {
  return <BaseSelect {...rest} />
}

export type IOption = OptionProps

export const Option: React.FC<IOption> = ({ ...rest }) => {
  return <BaseSelect.Option {...rest} />
}
