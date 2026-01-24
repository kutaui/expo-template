function first(array: unknown[]) {
    if (Array.isArray(array) === false) {
        return null;
    }

    if (array.length === 0) {
        return null;
    }

    return array[0];
}

function second(array: unknown[]) {
    if (Array.isArray(array) === false) {
        return null;
    }

    if (array.length < 2) {
        return null;
    }

    return array[1];
}

function last(array: unknown[]) {
    if (Array.isArray(array) === false) {
        return null;
    }

    if (array.length === 0) {
        return null;
    }

    return array[array.length - 1];
}

function isEmpty(array: unknown) {
    if (!Array.isArray(array)) {
        return true;
    }

    if (array.length === 0) {
        return true;
    }

    return false;
}

export default {
    first,
    second,
    last,
    isEmpty,
};
