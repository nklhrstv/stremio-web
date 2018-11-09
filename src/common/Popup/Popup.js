import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'stremio-common';
import Label from './Label';
import Menu from './Menu';
import styles from './styles';

class Popup extends PureComponent {
    constructor(props) {
        super(props);

        this.labelRef = React.createRef();

        this.state = {
            isOpen: false
        };
    }

    componentDidMount() {
        window.addEventListener('blur', this.close);
        window.addEventListener('resize', this.close);
        window.addEventListener('keyup', this.onKeyUp);
    }

    componentWillUnmount() {
        window.removeEventListener('blur', this.close);
        window.removeEventListener('resize', this.close);
        window.removeEventListener('keyup', this.onKeyUp);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.isOpen !== this.state.isOpen) {
            if (this.state.isOpen && typeof this.props.onAfterOpen === 'function') {
                this.props.onAfterOpen();
            } else if (!this.state.isOpen && typeof this.props.onAfterClose === 'function') {
                this.props.onAfterClose();
            }
        }
    }

    onKeyUp = (event) => {
        if (event.keyCode === 27) {
            this.close(event);
        }
    }

    open = (event) => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ isOpen: true });
    }

    close = (event) => {
        if (event && event.type === 'keyup') {
            event.stopPropagation();
        }

        this.setState({ isOpen: false });
    }

    menuContainerOnClick = (event) => {
        event.stopPropagation();
    }

    renderMenu() {
        if (!this.state.isOpen || !this.labelRef.current) {
            return null;
        }

        return (
            <Modal className={styles['menu-layer']} onRequestClose={this.close}>
                {React.Children.map(this.props.children, (child) => {
                    if (child.type === Menu) {
                        const labelRect = this.labelRef.current.getBoundingClientRect();
                        const menuContainerStyle = {};

                        if (isNaN(child.props.height)) {
                            menuContainerStyle.top = labelRect.y + labelRect.height;
                            menuContainerStyle.maxHeight = window.innerHeight - menuContainerStyle.top;
                        } else if (labelRect.y + labelRect.height + child.props.height <= window.innerHeight) {
                            menuContainerStyle.top = labelRect.y + labelRect.height;
                            menuContainerStyle.height = child.props.height;
                        } else if (child.props.height < labelRect.y) {
                            menuContainerStyle.bottom = window.innerHeight - labelRect.y;
                            menuContainerStyle.height = child.props.height;
                        } else {
                            menuContainerStyle.bottom = 0;
                            menuContainerStyle.top = 0;
                        }

                        if (isNaN(child.props.width)) {
                            menuContainerStyle.left = labelRect.x;
                            menuContainerStyle.width = labelRect.width;
                        } else if (labelRect.x + child.props.width <= window.innerWidth) {
                            menuContainerStyle.left = labelRect.x;
                            menuContainerStyle.width = child.props.width;
                        } else if (labelRect.x + labelRect.width > child.props.width) {
                            menuContainerStyle.left = labelRect.x + labelRect.width - child.props.width;
                            menuContainerStyle.width = child.props.width;
                        } else {
                            menuContainerStyle.left = 0;
                            menuContainerStyle.right = 0;
                        }

                        return (
                            <div style={menuContainerStyle} className={styles['menu-container']} onClick={this.menuContainerOnClick}>
                                {child}
                            </div>
                        );
                    }

                    return null;
                })}
            </Modal>
        );
    }

    render() {
        React.Children.forEach(this.props.children, (child) => {
            if (child.type !== Menu && child.type !== Label) {
                console.warn(new Error('Popup children should be of type Popup.Menu or Popup.Label'));
            }
        });

        return (
            <Fragment>
                {React.Children.map(this.props.children, (child) => {
                    return child.type === Label ? React.cloneElement(child, { ref: this.labelRef, onClick: this.open }) : null;
                })}
                {this.renderMenu()}
            </Fragment>
        );
    }
}

Popup.propTypes = {
    onAfterOpen: PropTypes.func,
    onAfterClose: PropTypes.func
};

Popup.Label = Label;
Popup.Menu = Menu;

export default Popup;