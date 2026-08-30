function getOptimizedImageUrl(url: string, width = 900) {
  if (!url.includes("res.cloudinary.com")) {
    return url;
  }

  return url.replace(
    "/image/upload/",
    `/image/upload/w_${width},c_limit,q_auto,f_auto/`,
  );
}

export default getOptimizedImageUrl;
