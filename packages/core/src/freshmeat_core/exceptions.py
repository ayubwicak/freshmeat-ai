class FreshMeatError(Exception):
    """Base exception for FreshMeat domain errors."""


class InvalidImageError(FreshMeatError):
    """Raised when the uploaded image cannot be decoded."""


class ROINotDetectedError(InvalidImageError):
    """Raised when no meat region can be segmented from the image."""
