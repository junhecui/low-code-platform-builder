import React from 'react';

const ImageWidget = ({ id, data }) => {
  const content = data.imageUrl ? (
    <img src={data.imageUrl} alt="Uploaded" className="w-full h-auto" />
  ) : (
    <div>
      <p className="text-gray-500">Upload Image:</p>
    </div>
  );

  if (data.clickable) {
    const link = data.pageLink ? `/page/${data.pageLink}` : data.link;
    return (
      <a href={link} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <div className="image-widget">{content}</div>;
};

export default ImageWidget;