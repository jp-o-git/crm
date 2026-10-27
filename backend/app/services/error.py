class NotFoundError(Exception):   # we turn this into a 404
    pass

class ConflictError(Exception):   # we turn this into a 409
    pass