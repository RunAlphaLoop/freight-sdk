.PHONY: pypi clean

pypi: clean
	cd python && pip install build twine -q && python -m build && twine upload dist/*

clean:
	rm -rf python/dist python/build python/*.egg-info
