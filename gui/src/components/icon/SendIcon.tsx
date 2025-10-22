import React from "react";

const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
    return (
        <svg
            viewBox="0 0 1024 1024"
            width="1em"
            height="1em"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M0 524.8l281.6 166.4 582.4-531.2L384 704l384 128 256-832zM384 985.6L512 832l-128-64z"
            />
        </svg>
    );
};

export default SendIcon;