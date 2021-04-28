import { Input } from 'antd'
const { Search } = Input
import React from 'react'
import { SearchProps } from 'antd/lib/input/Search'

export type IInputSearch = SearchProps

export const InputSearch: React.FC<IInputSearch> = ({ ...rest }) => {
  return <Search {...rest} />
}
