import { Form, Input } from 'antd'
import PropTypes from 'prop-types'

const CustomInputField = props => {
  const { Item } = Form
  const { name, placeholder, rules, label } = props

  return (
    <Item className='field-wrapper' label={label}>
      <Input
        className='inputField'
        name={name}
        placeholder={placeholder}
        rules={rules}
      />
    </Item>
  )
}

CustomInputField.propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string.isRequired,
  label: PropTypes.string,
  rules: PropTypes.array
}

export default CustomInputField
